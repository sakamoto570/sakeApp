import type { SakeDetailResponse } from "@sake-app/shared";

import {
  fetchBrands,
  fetchBreweries,
  type SakenowaBrand,
  type SakenowaBrewery,
} from "../clients/sakenowaClient";
import type { SakeRepository } from "../repositories/sakeRepository";

export class SakeNotFoundError extends Error {
  constructor(sakeId: string) {
    super(`Sake not found: ${sakeId}`);
    this.name = "SakeNotFoundError";
  }
}

export class SakeDetailService {
  constructor(
    private readonly sakeRepository: SakeRepository,
    private readonly brandsClient: () => Promise<SakenowaBrand[]> =
      fetchBrands,
    private readonly breweriesClient: () => Promise<SakenowaBrewery[]> =
      fetchBreweries,
  ) {}

  async getDetail(sakeId: string): Promise<SakeDetailResponse> {
    const [brands, breweries, sakeMasterItem] = await Promise.all([
      this.brandsClient(),
      this.breweriesClient(),
      this.sakeRepository.getSakeMasterItem(sakeId),
    ]);
    const brandId = Number(sakeId);
    const brand = Number.isInteger(brandId)
      ? brands.find((candidate) => candidate.id === brandId)
      : undefined;

    if (!brand) {
      throw new SakeNotFoundError(sakeId);
    }

    const brewery = breweries.find(
      (candidate) => candidate.id === brand.breweryId,
    );

    return {
      sakeId,
      name: brand.name,
      breweryName: brewery?.name,
      flavor: sakeMasterItem?.flavor,
    };
  }
}
