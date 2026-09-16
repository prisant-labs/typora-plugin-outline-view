export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface OutlineHeading {
  key: string
  cid?: string
  level: HeadingLevel
  text: string
  element: HTMLElement
}

export interface OutlineNode extends OutlineHeading {
  parentKey?: string
  children: OutlineNode[]
}
