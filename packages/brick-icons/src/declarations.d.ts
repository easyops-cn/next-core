declare module "*/generated/categories" {
  const categories: Record<
    string,
    () => Promise<Record<string, SvgrComponent>>
  >;
  export default categories;
}

declare module "*/generated/iconsByCategory";
