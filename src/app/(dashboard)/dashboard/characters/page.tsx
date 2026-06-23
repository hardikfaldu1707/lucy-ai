import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function CharactersPage() {
  redirect(ROUTES.publicChatNew);
}
