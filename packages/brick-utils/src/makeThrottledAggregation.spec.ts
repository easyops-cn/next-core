import { makeThrottledAggregation } from "./makeThrottledAggregation";
import {
  UserAdminApi_searchAllUsersInfo,
  type UserAdminApi_SearchAllUsersInfoResponseBody,
} from "@next-sdk/user-service-sdk";

jest.mock("@next-sdk/user-service-sdk");

// We will put this function in `@easyops-cn/next-libs`.
const getUserInfoByNameOrInstanceId = makeThrottledAggregation(
  "getUserInfoByNameOrInstanceId",
  (ids: string[]) =>
    UserAdminApi_searchAllUsersInfo({
      query: {
        state: "valid",
        $or: [
          {
            name: {
              $in: ids,
            },
          },
          {
            instanceId: {
              $in: ids,
            },
          },
        ],
      },
      fields: {
        name: true,
        nickname: true,
        user_email: true,
        user_tel: true,
        user_icon: true,
        user_memo: true,
      },
    }),
  ({ list }: UserAdminApi_SearchAllUsersInfoResponseBody, id: string) => {
    return list.find((item) => item.instanceId === id || item.name === id);
  }
);

const fakeUsers = [
  {
    name: "a",
    instanceId: "1",
  },
  {
    name: "b",
    instanceId: "2",
  },
  {
    name: "c",
    instanceId: "3",
  },
  {
    name: "d",
    instanceId: "4",
  },
];

(UserAdminApi_searchAllUsersInfo as jest.Mock).mockImplementation(
  ({ query }: { query: any }) => {
    // Fake matching.
    return Promise.resolve({
      list: fakeUsers
        .filter(
          (user) =>
            query.$or[0].name.$in.some((name: string) => name === user.name) ||
            query.$or[1].instanceId.$in.some(
              (instanceId: string) => instanceId === user.instanceId
            )
        )
        .map((item) => ({ ...item })),
    });
  }
);

describe("makeThrottledAggregation", () => {
  it("should work", async () => {
    const promises: Promise<any>[] = [];
    promises.push(getUserInfoByNameOrInstanceId("a"));
    jest.advanceTimersByTime(60);
    expect(UserAdminApi_searchAllUsersInfo).toBeCalledTimes(0);
    promises.push(getUserInfoByNameOrInstanceId("2"));
    expect(UserAdminApi_searchAllUsersInfo).toBeCalledTimes(0);

    jest.advanceTimersByTime(40);
    expect(UserAdminApi_searchAllUsersInfo).toBeCalledTimes(1);
    expect(UserAdminApi_searchAllUsersInfo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        query: {
          state: "valid",
          $or: [
            {
              name: {
                $in: ["a", "2"],
              },
            },
            {
              instanceId: {
                $in: ["a", "2"],
              },
            },
          ],
        },
      })
    );
    const results = await Promise.all(promises);
    expect(results).toEqual(fakeUsers.slice(0, 2));

    promises.length = 0;
    // This should be cached
    promises.push(getUserInfoByNameOrInstanceId("2"));
    jest.advanceTimersByTime(50);
    promises.push(getUserInfoByNameOrInstanceId("c"));
    jest.advanceTimersByTime(50);
    expect(UserAdminApi_searchAllUsersInfo).toBeCalledTimes(1);

    jest.advanceTimersByTime(50);
    expect(UserAdminApi_searchAllUsersInfo).toBeCalledTimes(2);
    expect(UserAdminApi_searchAllUsersInfo).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        query: {
          state: "valid",
          $or: [
            {
              name: {
                $in: ["c"],
              },
            },
            {
              instanceId: {
                $in: ["c"],
              },
            },
          ],
        },
      })
    );
    const results2 = await Promise.all(promises);
    // [b, c]
    expect(results2).toEqual(fakeUsers.slice(1, 3));
  });
});
