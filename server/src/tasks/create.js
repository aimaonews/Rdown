import { sanitizeFilename, isMagnet, isTorrentUrl, isStreamUrl } from '../util/helpers.js';

/**
 * 任务创建核心逻辑（REST 与 MCP 共用）。
 * 从 ApiServer 的 POST /api/v1/tasks 路由提取，行为保持一致。
 */
export async function createTaskFromBody(api, b) {
  const url = b.url || (Array.isArray(b.urls) ? b.urls[0] : '');
  if (!url && !b.torrentBase64 && !b.metalinkBase64) throw new Error('url, torrentBase64 or metalinkBase64 required');

  const opt = {};
  const o = b.options || {};
  if (o.dir) opt.dir = o.dir;
  if (o.out) opt.out = sanitizeFilename(o.out);
  if (o.referer) opt.referer = o.referer;
  if (o.userAgent) opt['user-agent'] = o.userAgent;
  if (o.split) opt.split = String(o.split);
  if (o.maxConnectionPerServer) opt['max-connection-per-server'] = String(o.maxConnectionPerServer);
  if (o.header || o.headers) {
    const h = o.header || o.headers;
    opt.header = Array.isArray(h) ? h : [h];
  }
  if (o.cookie) opt.header = [...(opt.header || []), `Cookie: ${o.cookie}`];
  if (o.selectFile) opt['select-file'] = String(o.selectFile);
  if (o.seedTime !== undefined) opt['seed-time'] = String(o.seedTime);
  if (o.checksum) opt.checksum = o.checksum;   // 形如 "sha-1=BASE32..."（aria2 --checksum）

  // 流媒体任务
  const streamReq = b.stream || (url && isStreamUrl(url) ? {} : null);
  if (url && streamReq !== null && !b.torrentBase64) {
    const task = await api.stream.create({
      url,
      headers: opt.header || [],
      saveDir: o.dir || api.settings.downloadDir,
      saveName: o.out ? sanitizeFilename(o.out) : undefined,
      select: streamReq.select || 'best',
      key: streamReq.key,
      iv: streamReq.iv,
      drop: streamReq.drop,
      adKeywords: streamReq.adKeywords,
      customRange: streamReq.customRange,
      liveRecordLimitMin: streamReq.liveRecordLimitMin ?? api.settings.streamLiveRecordLimitMin,
      mux: streamReq.mux ?? api.settings.streamMuxAfterDownload,
      referer: o.referer,
      userAgent: o.userAgent,
    });
    if (o.startAt && api.scheduler) {
      await api.stream.pause(task.id).catch(() => {});
      api.scheduler.schedule('stream', task.id, o.startAt);
    }
    return { id: task.id, engine: 'stream' };
  }

  let gid;
  const startAt = o.startAt;   // N_m3u8DL --task-start-at：先暂停，定时启动
  if (startAt) opt.pause = 'true';
  if (b.metalinkBase64) {
    const results = await api.rpc.addMetalink(b.metalinkBase64, opt);
    gid = Array.isArray(results) ? results[0] : results;
  } else if (b.torrentBase64) {
    gid = await api.rpc.addTorrent(b.torrentBase64, [], opt);
  } else if (isMagnet(url)) {
    gid = await api.rpc.addUri([url], opt);
  } else {
    gid = await api.rpc.addUri(Array.isArray(b.urls) ? b.urls : [url], opt);
  }
  api.store.setMeta(gid, {
    name: opt.out || '',
    createdAt: Date.now(),
    kind: isMagnet(url) || b.torrentBase64 ? 'torrent' : (isTorrentUrl(url) ? 'torrent' : 'file'),
  });
  if (startAt && api.scheduler) api.scheduler.schedule('aria2', gid, startAt);
  return { id: gid, engine: 'aria2' };
}
