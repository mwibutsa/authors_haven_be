import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import select from 'lodash';

dotenv.config();

const hashPassword = (password) => {
  try {
    const salt = bcrypt.genSaltSync(12);
    const hashedPassword = bcrypt.hashSync(password, salt);
    return hashedPassword;
  } catch (error) {
    return false;
  }
};
const comparePassword = (password, hashedPassword) => {
  try {
    return bcrypt.compareSync(password, hashedPassword);
  } catch (error) {
    return false;
  }
};

const generateToken = (user) => {
  const token = jwt.sign(user, process.env.SECRETKEY, { expiresIn: '1 day' });
  return token;
};
const handleUsed = (emailUsed, userNameUsed) => {
  if (emailUsed && userNameUsed) {
    return 'Both email and username are in use';
  }
  if (emailUsed) {
    return 'email is already in use';
  }
  if (userNameUsed) {
    return 'username is not available';
  }
  return true;
};
const validatePassword = (password) => {
  let message = '';
  const hasCharacter = ['@', '*', '%', '^', '!', '~', '`', '"', "'"].some(r => password.includes(r));
  if (!hasCharacter) message += 'The password  should have at least one special character';
  if (!/(.*\d.*)/.test(password)) {
    message += 'The password Must contain at least one number';
  }
  if (!/(.*[a-z].*)/.test(password)) {
    message += 'The password must contain at least one lower case character';
  }
  if (!/(.*[A-Z].*)/.test(password)) {
    message += 'the password should contain at least one uppercase character';
  }
  if (password.length < 8) {
    message += 'password must not be less than 8 characters';
  }
  return message === '' ? true : message;
};

const authenticationResponse = (res, token, userData) => res
  .header('x-auth-token', token)
  .status(200)
  .json({
    user: {
      ...userData,
      token,
    },
  });
const articleReadTime = article => Math.ceil(article.split(' ').length / 275);
const combineHelper = (combinedObj, obj2) => ({ ...combinedObj, ...obj2 });
const combineWithArticle = (article, ...rest) => {
  const articleObject = select.pick(article, [
    'id',
    'slug',
    'taglist',
    'title',
    'body',
    'description',
    'authorid',
    'createdAt',
    'updatedAt',
  ]);
  return {
    ...articleObject,
    ...rest.reduce(combineHelper),
    readTimeMinutes: articleReadTime(articleObject.body),
  };
};
const asyncHandler = callBackFunction => async (req, res, next) => {
  try {
    await callBackFunction(req, res, next);
  } catch (error) {
    const statusCode = error.name === 'SequelizeValidationError' ? 400 : 500;
    res.status(statusCode).json({
      error: error.message,
    });
  }
};
const decodeToken = req => jwt.verify(req.header('x-auth-token'), process.env.SECRETKEY);
const jsonResponse = (res, statusCode, message) => res.status(statusCode).json(message);
const compareAction = (action1, action2) => action1 || action2;
const createSearchKeyword = (keyword) => {
  keyword = `%${keyword}%`;
  keyword = keyword.replace(' ', '% %');
  keyword = keyword.split(' ');
  return keyword;
};
export default {
  hashPassword,
  comparePassword,
  generateToken,
  handleUsed,
  validatePassword,
  authenticationResponse,
  decodeToken,
  asyncHandler,
  articleReadTime,
  combineWithArticle,
  combineHelper,
  jsonResponse,
  compareAction,
  createSearchKeyword,
};
