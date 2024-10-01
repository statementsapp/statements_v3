const subjects = ['The cat', 'A dog', 'The bird', 'An elephant', 'The scientist']
const verbs = ['jumped', 'ran', 'flew', 'studied', 'observed']
const objects = ['over the fence', 'through the forest', 'in the lab', 'under the microscope', 'across the field']

export function generateRandomSentence(): string {
  const subject = subjects[Math.floor(Math.random() * subjects.length)]
  const verb = verbs[Math.floor(Math.random() * verbs.length)]
  const object = objects[Math.floor(Math.random() * objects.length)]
  return `${subject} ${verb} ${object}.`
}