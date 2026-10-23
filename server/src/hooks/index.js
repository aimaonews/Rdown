import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 下载后处理钩子（Gopeed webhook / 后处理脚本 / 自动解压）：
 *  - 任务完成/失败时 POST settings.webhookUrl（JSON：{event, task}）
 *  - 执行 settings.postScript（env 注入 RDOWN_EVENT/RDOWN_TASK_ID/RDOWN_TASK_NAME/RDOWN_FILE_*）
 *  - settings.autoExtract 时自动解压 zip/tar/tgz（Windows 内置 tar.exe = bsdtar 可解 zip/tar；
 *    7z/rar 需要外部 7z，未内置时给出明确提示）
 */
export class HookRunner {
  constructor(settings) { this.settings = settings; }

  update(settings) { this.settings = settings; }

  async fire(event, task) {
    const jobs = [this._webhook(event, task), this._script(event, task)];
    if (event === 'complete') jobs.push(this._autoExtract(task));
    await Promise.allSettled(jobs);
  }

  async _webhook(event, task) {
    const url = this.settings.webhookUrl;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, task: this._brief(task) }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (e) { console.log(`[hooks] webhook failed: ${e.message}`); }
  }

  async _script(event, task) {
    const script = this.settings.postScript;
    if (!script) return;
    const files = (task.files || []).map(f => f.path || f).filter(Boolean);
    await new Promise((resolve) => {
      const p = spawn(script, [event, String(task.id || '')], {
        env: {
          ...process.env,
          RDOWN_EVENT: event,
          RDOWN_TASK_ID: String(task.id || ''),
          RDOWN_TASK_NAME: String(task.name || ''),
          RDOWN_FILE: files[0] || '',
          RDOWN_FILE_COUNT: String(files.length),
        },
        shell: process.platform === 'win32',
        windowsHide: true,
        timeout: 300000,
      });
      p.on('error', (e) => { console.log(`[hooks] script error: ${e.message}`); resolve(); });
      p.on('exit', resolve);
      p.stderr?.on('data', (d) => console.log(`[hooks] script stderr: ${d}`));
    });
  }

  async _autoExtract(task) {
    if (!this.settings.autoExtract) return;
    const files = (task.files || []).map(f => f.path || f).filter(Boolean);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const isTarGz = /\.(tar\.gz|tar\.bz2|tar\.xz|tgz)$/i.test(file);
      const supported = isTarGz || ['.zip', '.tar', '.gz'].includes(ext);
      if (!supported || !fs.existsSync(file)) continue;
      const outDir = file.replace(/\.(zip|tar|tgz|tar\.gz|tar\.bz2|tar\.xz|gz)$/i, '');
      try {
        fs.mkdirSync(outDir, { recursive: true });
        // Windows 10+ 自带 bsdtar（tar.exe），支持 zip/tar/tgz
        await new Promise((resolve, reject) => {
          const p = spawn('tar', ['-xf', file, '-C', outDir], { windowsHide: true, timeout: 600000 });
          p.on('error', reject);
          p.on('exit', (code) => code === 0 ? resolve() : reject(new Error('tar exit ' + code)));
        });
        console.log(`[hooks] extracted ${path.basename(file)} -> ${outDir}`);
      } catch (e) {
        console.log(`[hooks] auto-extract ${path.basename(file)} failed: ${e.message}（7z/rar 需安装 7-Zip 后手动解压）`);
      }
    }
  }

  _brief(task) {
    return {
      id: task.id, name: task.name, kind: task.kind || task.engine,
      status: task.status, totalLength: task.totalLength, completedLength: task.completedLength,
      dir: task.dir, files: (task.files || []).map(f => f.path || f),
    };
  }
}
