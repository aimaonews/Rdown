/**
 * 速度历史环形缓冲（数据看板数据源，Motrix Dashboard 数据源等价物）：
 * 每 1s 采样一次全局速度，保留最近 300 点（5 分钟）。
 */
export class SpeedHistory {
  constructor() {
    this.samples = [];           // [{t, down, up}]
    this.maxSamples = 300;
    this.totals = { downloaded: 0, uploaded: 0, completedCount: 0 };
  }

  sample(down, up) {
    this.samples.push({ t: Date.now(), down: down | 0, up: up | 0 });
    if (this.samples.length > this.maxSamples) this.samples.shift();
  }

  /** 用任务列表估算累计下载量（aria2 不跨会话统计） */
  accumulate(tasks) {
    let dl = 0, ul = 0, done = 0;
    for (const t of tasks) {
      dl += t.completedLength || 0;
      ul += t.uploadLength || 0;
      if (t.status === 'complete') done++;
    }
    this.totals = { downloaded: dl, uploaded: ul, completedCount: done };
  }

  snapshot() {
    return { history: this.samples, totals: this.totals };
  }
}
