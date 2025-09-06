import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getServerSession } from "next-auth/next";
import { serverGetProductBundle, serverGetHome, serverGetAdvancedSearch } from "@/lib/api/server";
import BannerWithClient from "@/components/shop/Home/BannerWithClient";
import SaleBanner from "@/components/common/SaleBanner";
import ScrollingBanner from "@/components/common/ScrollingBanner";
import CategoriesHome from "@/components/shop/Home/CategoriesHome";
import BrandHome from "@/components/shop/Home/BrandHome";
import ArrivedProducts from "@/components/shop/Home/ArrivedProducts";
import TrendingProducts from "@/components/shop/Home/TrendingProducts";
export default async function HomePage({ params }) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale)
  const session = await getServerSession(authOptions);
  console.log(session)
  const results = await Promise.allSettled([
    serverGetHome(locale),
    serverGetProductBundle(locale),
    serverGetAdvancedSearch(locale)
  ]);
  const [home, productBundle, advancedSearch] = results;
  console.log(advancedSearch)
  return (
    <>
      <SaleBanner />
      <BannerWithClient banners={home.status === "fulfilled" ? home.value.banners : []} />
      <ScrollingBanner />
      <CategoriesHome categories={home.status === 'fulfilled' ? home.value.categories : []} />
      <BrandHome brands={advancedSearch.status === 'fulfilled' ? advancedSearch.value.productSearchBasicData.brands : []} />
      <ArrivedProducts arrivedProducts={home.status === 'fulfilled' ? home.value.recentlyArrived : []} />
      <TrendingProducts productDiscounts={home.status === 'fulfilled' ? home.value.recentlyArrived : []} popularProducts={home.status === 'fulfilled' ? home.value.recentlyArrived : {}} />
    </>
  )
}