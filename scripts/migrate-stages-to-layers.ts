/**
 * ステージJSONをレイヤー形式に変換するスクリプト
 * 旧形式: string[] → 新形式: string[][] (レイヤー配列)
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const stagesDir = join(process.cwd(), 'stages')

// ステージファイル一覧を取得
const stageFiles = readdirSync(stagesDir).filter((f) => f.match(/^stage-\d+\.json$/))

console.log(`🔄 Converting ${stageFiles.length} stage files to layer format...`)

for (const file of stageFiles) {
  const filePath = join(stagesDir, file)
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'))

  // 既に新形式かチェック (配列の配列)
  if (Array.isArray(raw[0]) && Array.isArray(raw[0][0] === undefined || typeof raw[0][0] === 'string')) {
    // raw[0] が配列で、その中身が文字列なら新形式
    if (Array.isArray(raw[0]) && typeof raw[0][0] === 'string') {
      console.log(`  ⏭️  ${file} - already in layer format, skipping`)
      continue
    }
  }

  // 旧形式 (string[]) → 新形式 (string[][]) に変換
  if (typeof raw[0] === 'string') {
    const newFormat = [raw] // レイヤー0として包む
    writeFileSync(filePath, JSON.stringify(newFormat, null, 2))
    console.log(`  ✅ ${file} - converted to layer format`)
  } else {
    console.log(`  ⚠️  ${file} - unknown format, skipping`)
  }
}

console.log('✅ Migration complete!')
