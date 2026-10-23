/**
 * 定时任务调度器（N_m3u8DL-RE --task-start-at 语义）：
 * 任务以 paused/waiting 状态创建，到达 startAt 后自动启动。
 * 持久化在 TaskStore.meta 中，重启后恢复调度。
 */
export class TaskScheduler {
  constructor(rpc, stream, store) {
    this.rpc = rpc;
    this.stream = stream;
    this.store = store;
    this.timer = null;
  }

  /** 登记一个定时任务。engine: 'aria2'|'stream' */
  schedule(engine, id, startAt) {
    const ts = typeof startAt === 'number' ? startAt : Date.parse(startAt);
    if (!Number.isFinite(ts)) throw new Error('invalid startAt');
    this.store.setMeta(id, { scheduledAt: ts, engine });
    this._ensureTimer();
    return ts;
  }

  cancel(id) {
    const meta = this.store.getMeta(id);
    if (meta) { delete meta.scheduledAt; this.store.setMeta(id, meta); }
  }

  _ensureTimer() {
    if (this.timer) return;
    this.timer = setInterval(() => this._tick(), 15000);
    this.timer.unref?.();
  }

  async _tick() {
    const now = Date.now();
    for (const [id, meta] of Object.entries(this.store.db.meta)) {
      if (!meta?.scheduledAt || meta.scheduledAt > now) continue;
      delete meta.scheduledAt;
      this.store.setMeta(id, meta);
      try {
        if (meta.engine === 'stream') await this.stream.resume(id);
        else await this.rpc.unpause(id);
        console.log(`[scheduler] started scheduled task ${id}`);
      } catch (e) {
        console.log(`[scheduler] start ${id} failed: ${e.message}`);
      }
    }
  }

  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
}
