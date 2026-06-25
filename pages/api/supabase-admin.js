export default function handler(req, res) {
  return res.status(404).json({ status: 'error', message: 'Not found' })
}
