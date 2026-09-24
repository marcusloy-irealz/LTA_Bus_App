import busHandler from './bus.js';

export default async function handler(req, res) {
  return busHandler(req, res);
}
