const { createQuiz } = require('./quiz.service');

async function create(req, res) {
  const { title, description } = req.body;
  const hostId = req.user.id;

  try {
    const quiz = await createQuiz(hostId, title, description);
    return res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { create };