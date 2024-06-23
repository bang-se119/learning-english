import Image from "next/image";
import styles from "./page.module.css";
import VocabularyTable from "@/components/VocabularyTable/index";

export default function Home() {
  return (
    <main className={styles.main}>
      <VocabularyTable />
    </main>
  );
}
