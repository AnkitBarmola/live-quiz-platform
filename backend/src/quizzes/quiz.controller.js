const { createQuiz, addQuestion } = require('./quiz.service');

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

async function addQuestionToQuiz(req, res) {
  const { quizId } = req.params;
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
  } = req.body;
  const hostId = req.user.id;

  try {
    const question = await addQuestion(quizId, hostId, {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
    });
    return res.status(201).json({ question });
  } catch (err) {
    if (err.message === 'Not authorized to modify this quiz') {
      return res.status(403).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { create, addQuestionToQuiz };