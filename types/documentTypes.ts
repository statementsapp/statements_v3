export type Remark = {
  id: string;
  text: string;
  sentenceId: string;
  rejoined: boolean;
}

export type Sentence = {
  id: string
  sentenceId: string
  text: string
  remarks: Remark[]
  remarkColor?: string
}

export type Paragraph = {
  id: string
  sentences: Sentence[]
}
