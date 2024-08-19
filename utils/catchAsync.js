module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next)
      .then(() => {
      //  console.log(req.body);
      })
      .catch(next);
  };
};
