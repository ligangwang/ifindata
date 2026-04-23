import type { Metadata } from "next";
import { CreatePredictionPage } from "@/components/create-prediction-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "New prediction | YouAnalyst",
  description: "Create a new public stock prediction on YouAnalyst.",
  robots: noIndexRobots(),
};

export default function NewPredictionRoutePage() {
  return <CreatePredictionPage />;
}
