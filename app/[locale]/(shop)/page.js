import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getServerSession } from "next-auth/next";
import { serverGetProductBundle, serverGetHome } from "@/lib/api/server";

export default async function HomePage({ params }) {
      const { locale } = await params;
      const dictionary = await getDictionary(locale)
  const session = await getServerSession(authOptions);
console.log(session)
  const [home, productBundle] = await Promise.all([
    serverGetHome(locale),
    serverGetProductBundle(locale)
  ]) 
  console.log(home)
  return (
    <>
<p>hjhgjhgjhg</p>
    </>
  )
}