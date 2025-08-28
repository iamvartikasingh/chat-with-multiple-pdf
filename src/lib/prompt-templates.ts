export const STANDALONE_QUESTION_TEMPLATE = `Given the following conversation and a follow-up question, rephrase the follow-up so it can be understood by itself.
Chat history:
{chat_history}
Follow-up question: {question}
Standalone question:`;

export const QA_TEMPLATE = `You are a helpful assistant. Use the following context to answer the user’s question.
If you don’t know the answer, say you don’t know.
Context:
{context}

Question: {question}
Helpful answer:`;