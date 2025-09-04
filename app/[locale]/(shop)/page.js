import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BB from "@/components/BB";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getServerSession } from "next-auth/next";

export default async function HomePage({ params }) {
      const { locale } = await params;
      const dictionary = await getDictionary(locale)
  const session = await getServerSession(authOptions);
console.log(session)
      
  return (
    <>
    <BB/>
<p>hjhgjhgjhg</p>
    </>
  )
}