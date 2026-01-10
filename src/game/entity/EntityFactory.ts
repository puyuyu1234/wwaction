import { StageContext } from '@game/types'

import { Coin } from './Coin'
import { DekaNasake } from './DekaNasake'
import { Entity } from './Entity'
import { Fun } from './Fun'
import { Funkorogashi } from './Funkorogashi'
import { Gurasan } from './Gurasan'
import { GurasanNotFall } from './GurasanNotFall'
import { Nasake } from './Nasake'
import { Nuefu } from './Nuefu'
import { Onpu } from './Onpu'
import { PhysicsCoin } from './PhysicsCoin'
import { Potion } from './Potion'
import { Semi } from './Semi'
import { Shimi } from './Shimi'

/**
 * エンティティ生成オプション
 */
export type EntitySpawnOptions = {
  context: StageContext
  getPlayerX?: () => number
  onSpawn?: (entity: Entity) => void
}

/**
 * エンティティを名前から生成する
 */
export function createEntity(
  name: string,
  x: number,
  y: number,
  options: EntitySpawnOptions
): Entity | null {
  const { context, getPlayerX, onSpawn } = options

  switch (name) {
    case 'Nasake':
      return new Nasake(x + 8, y + 8, context)

    case 'Gurasan':
      return new Gurasan(x + 8, y + 8, context)

    case 'GurasanNotFall':
      return new GurasanNotFall(x + 8, y + 8, context)

    case 'Potion':
      return new Potion(x + 8, y + 8, context)

    case 'Coin':
      return new Coin(x + 8, y + 8, context)

    case 'Nuefu':
      return new Nuefu(x + 8, y + 8, context)

    case 'Shimi':
      return new Shimi(x + 16, y + 8, context)

    case 'Dekanasake': {
      const deka = new DekaNasake(x + 16, y + 16, context)
      if (onSpawn) {
        deka.behavior.on('spawnCoin', (coin: PhysicsCoin) => onSpawn(coin))
      }
      return deka
    }

    case 'Funkorogashi': {
      if (!getPlayerX) return null
      const funko = new Funkorogashi(x + 8, y + 8, context, getPlayerX)
      if (onSpawn) {
        funko.behavior.on('spawnFun', (fun: Fun) => onSpawn(fun))
      }
      return funko
    }

    case 'Semi': {
      if (!getPlayerX) return null
      const semi = new Semi(x + 8, y + 8, getPlayerX)
      if (onSpawn) {
        semi.behavior.on('spawnOnpu', (onpu: Onpu) => onSpawn(onpu))
      }
      return semi
    }

    default:
      return null
  }
}
