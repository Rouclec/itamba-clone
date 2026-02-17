export interface DocumentItem {
  id: string
  reference: string
  title: string
  type: string
  articles: number
  issued: string
  language: string
}

const TYPES = ['Decree', 'Law', 'Ordinances', 'Acts']
const LANGUAGES = ['english', 'french']

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getMockDocuments(page: number, pageSize: number): DocumentItem[] {
  const start = (page - 1) * pageSize
  const items: DocumentItem[] = []
  for (let i = 0; i < pageSize; i++) {
    const n = start + i + 1
    items.push({
      id: `doc-${n}`,
      reference: `DEC-2025/${395 + n}`,
      title: `Decree to appoint members of the board of directors of the agricultural mechanization study group and related matters (excerpt) ${n}`,
      type: randomItem(TYPES),
      articles: 30 + (n % 20),
      issued: new Date(2022, 9, 5 + (n % 30)).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: '2-digit' }),
      language: randomItem(LANGUAGES),
    })
  }
  return items
}

export const MOCK_TOTAL_DOCUMENTS = 900
