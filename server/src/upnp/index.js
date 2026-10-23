import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const NatAPI = require('nat-api');

/**
 * UPnP/NAT-PMP 端口映射管理器（参考 Motrix src/main/core/UPnPManager.js：
 * 薄封装 nat-api 库，map/unmap BT 监听端口，失败仅告警不阻断下载）。
 */
export class UpnpManager {
  constructor(settings) {
    this.settings = settings;
    this.client = null;
    this.mappedPorts = new Set();
  }

  _ensureClient() {
    if (!this.client) {
      this.client = new NatAPI({ autoUpdate: true });
    }
    return this.client;
  }

  /** 映射端口（BT 监听端口 + DHT 端口）。失败返回 false 并记日志，不影响下载。 */
  async map(port) {
    if (!port) return false;
    if (this.mappedPorts.has(port)) return true;
    try {
      const client = this._ensureClient();
      await new Promise((resolve, reject) => client.map(port, (err) => err ? reject(err) : resolve()));
      this.mappedPorts.add(port);
      console.log(`[upnp] port ${port} mapped (UPnP/NAT-PMP)`);
      return true;
    } catch (e) {
      console.log(`[upnp] map port ${port} failed: ${e.message}`);
      return false;
    }
  }

  async unmap(port) {
    if (!port || !this.mappedPorts.has(port)) return;
    try {
      const client = this._ensureClient();
      await new Promise((resolve, reject) => client.unmap(port, (err) => err ? reject(err) : resolve()));
      this.mappedPorts.delete(port);
      console.log(`[upnp] port ${port} unmapped`);
    } catch (e) {
      console.log(`[upnp] unmap port ${port} failed: ${e.message}`);
    }
  }

  /** 应用当前设置：开启则映射监听端口，关闭则清理既有映射。 */
  async apply(settings) {
    this.settings = settings;
    const port = Number(settings.listenPort) || 51413;
    if (settings.upnpEnabled) {
      await this.map(port);
    } else if (this.mappedPorts.size) {
      for (const p of [...this.mappedPorts]) await this.unmap(p);
    }
  }

  async destroy() {
    for (const p of [...this.mappedPorts]) await this.unmap(p);
    try { this.client?.destroy(); } catch {}
    this.client = null;
  }
}
