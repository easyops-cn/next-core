import InterceptorManager from "./InterceptorManager";
import { HttpRequestConfig } from "./http";

describe("InterceptorManager", () => {
  it("should work", async () => {
    class FakeHttp {
      public interceptors: {
        request: InterceptorManager;
      };

      constructor() {
        this.interceptors = {
          request: new InterceptorManager(),
        };
      }

      fetch(config: HttpRequestConfig): Promise<any> {
        const chain: any[] = [];
        let promise = Promise.resolve(config);

        this.interceptors.request.forEach((interceptor) => {
          chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        while (chain.length) {
          promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
      }
    }

    const http = new FakeHttp();

    const interceptorId = http.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return error;
      }
    );

    const interceptorId2 = http.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return error;
      }
    );

    const config = {
      url: "www.example.com/get",
      method: "GET",
    };
    await http.fetch(config);

    expect(http.interceptors.request.handlers).toHaveLength(2);
    http.interceptors.request.eject(interceptorId2);
    expect(http.interceptors.request.handlers[interceptorId2]).toBeNull();
  });
});
