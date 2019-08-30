export interface ResponseBodyWrapper<T> {
  code: number;
  data: T;
  error?: string;
  message?: string;
}

export interface ResponseListWrapper<T> {
  list: T[];
  page: number;
  page_size: number;
  total: number;
}
