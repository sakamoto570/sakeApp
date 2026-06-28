import type { SakeSearchResult } from "@sake-app/shared";

import { fetchBrands } from "../clients/sakenowaClient";

export class SakeSearchService {
  constructor(
    private readonly brandsClient: () => Promise<
      Awaited<ReturnType<typeof fetchBrands>>
    > = fetchBrands,
  ) {}

  async search(keyword: string): Promise<SakeSearchResult[]> {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase();
    const brands = await this.brandsClient();

    return brands
      .filter((brand) =>
        brand.name.toLocaleLowerCase().includes(normalizedKeyword),
      )
      .slice(0, 20)
      .map((brand) => ({
        sakeId: String(brand.id),
        name: brand.name,
      }));
  }
}
