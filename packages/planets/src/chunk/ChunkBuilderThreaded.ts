import { Material } from "three";
import {
  ChunkMap,
  ChunkTypes,
  CubeFaceChildChunkProps,
  CubeFaceRootChunkProps,
  PlanetProps
} from "../planet/Planet";
import WorkerThreadPool from "../worker/WorkerThreadPool";
import ChunkThreaded, { ChunkThreadedParams } from "./ChunkThreaded";
import {
  ChunkBuilderThreadedMessage,
  ChunkBuilderThreadedMessageTypes
} from "./types";

export default class ChunkBuilderThreaded<T, I> {
  #old: (CubeFaceRootChunkProps | CubeFaceChildChunkProps)[] = [];
  // we keep the chunks stored with key of width
  #pool: Record<number, ChunkThreaded[]> = {};
  #workerPool: WorkerThreadPool<ChunkBuilderThreadedMessage>;
  public id: string;
  constructor(numWorkers: number, worker: new () => Worker, initialData: PlanetProps & I, id: string) {
    this.id = id;
    this.#workerPool = new WorkerThreadPool(
      numWorkers,
      worker,
    );
    this.#workerPool.workers.forEach(worker => {
      const msg = {
        subject: ChunkBuilderThreadedMessageTypes.INITIAL_DATA,
        initialData,
        id: this.id,
      };
      worker.postMessage(msg, () => {
        // noop
      })
    })
  }

  get old() {
    return this.#old;
  }

  get busyLength() {
    return this.#workerPool.busyLength;
  }

  get queueLength() {
    return this.#workerPool.queueLength;
  }

  #onResult(chunk: ChunkThreaded, msg: any, material: Material) {
    if (msg.subject === ChunkBuilderThreadedMessageTypes.BUILD_CHUNK_RESULT) {
      chunk.rebuildMeshFromData({...msg.data, material });
      chunk.show();
    }
  }

  allocateChunk(params: ChunkThreadedParams<T>) {
    const w = params.width;

    if (!(w in this.#pool)) {
      this.#pool[w] = [];
    }

    let c: ChunkThreaded | null = null;
    if (this.#pool[w].length > 0) {
      c = this.#pool[w].pop()!;
      c.params = params;
    } else {
      c = new ChunkThreaded(params);
    }

    c.hide();

    const threadedParams = {
      width: params.width,
      offset: params.offset,
      radius: params.radius,
      origin: params.origin,
      resolution: params.resolution,
      worldMatrix: params.group.matrix,
      invert: params.invert,
      data: params.data
    };

    const msg = {
      subject: ChunkBuilderThreadedMessageTypes.BUILD_CHUNK,
      params: threadedParams,
      id: this.id
    };

    this.#workerPool.enqueue(msg, (m) => {
      if (c) {
        return void this.#onResult(c, m, params.material);
      }
    });

    return c;
  }

  retireChunks(recycle: (CubeFaceRootChunkProps | CubeFaceChildChunkProps)[]) {
    this.#old.push(...recycle);
  }

  #recycleChunks(
    oldChunks: (CubeFaceRootChunkProps | CubeFaceChildChunkProps)[]
  ) {
    for (let chunk of oldChunks) {
      if (chunk.type === ChunkTypes.ROOT) {
        // we never get rid of roots!
        return;
      }
      const childChunk = chunk as unknown as CubeFaceChildChunkProps;
      if (!(childChunk.chunk.params.width in this.#pool)) {
        this.#pool[childChunk.chunk.params.width] = [];
      }
      childChunk.chunk.destroy();
    }
  }

  get busy() {
    return this.#workerPool.busy;
  }

  rebuild(chunkMap: ChunkMap, data: T, material: Material) {
    for (let key in chunkMap) {
      const chunk = chunkMap[key];
      if (chunk.type === ChunkTypes.CHILD) {
        const { material: _prevMaterial, ...params } = chunk.chunk.params;

        const threadedParams = {
          width: params.width,
          offset: params.offset,
          radius: params.radius,
          origin: params.origin,
          resolution: params.resolution,
          worldMatrix: params.group.matrix,
          invert: params.invert,
          data
        };

        const msg = {
          subject: ChunkBuilderThreadedMessageTypes.BUILD_CHUNK,
          params: threadedParams,
          id: this.id
        };

        this.#workerPool.enqueue(msg, (m) => {
          if (chunk) {
            return void this.#onResult(chunk.chunk, m, material);
          }
        });
      }
    }
  }

  update() {
    if (!this.busy) {
      this.#recycleChunks(this.#old);
      this.#old = [];
    }
  }

  destroy () {
    this.#workerPool.workers.forEach(worker => {
      worker.destroy()
    })
  }
}
