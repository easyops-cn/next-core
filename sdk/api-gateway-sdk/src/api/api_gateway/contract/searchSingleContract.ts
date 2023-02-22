import { http, HttpOptions } from "@next-core/http";
import { ResponseBodyWrapper } from "../../../wrapper.js";

export interface ContractApi_SearchSingleContractRequestBody {
  /** 契约全名 */
  contractName: string;

  /** 契约版本 */
  version: string;
}

export interface ContractApi_SearchSingleContractResponseBody {
  /** contract instance */
  contractData?: Record<string, any>;
}

/**
 * @description 通过defaultOrg查找单个契约信息
 * @endpoint POST /api/contract/single_search
 */
export const ContractApi_searchSingleContract = async (
  data: ContractApi_SearchSingleContractRequestBody,
  options?: HttpOptions
): Promise<ContractApi_SearchSingleContractResponseBody> =>
  /**! @contract easyops.api.api_gateway.contract.SearchSingleContract@1.0.0 */ (
    await http.post<
      ResponseBodyWrapper<ContractApi_SearchSingleContractResponseBody>
    >("api/contract/single_search", data, options)
  ).data;
