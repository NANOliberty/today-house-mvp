const { ZodError } = require('zod');

// 사용법: router.post('/', validate(schema), handler)
// 실패 시 400 + 어떤 필드가 왜 틀렸는지 반환
module.exports = function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      req[source] = schema.parse(req[source]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: '입력값이 올바르지 않습니다',
          errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
      }
      next(err);
    }
  };
};
