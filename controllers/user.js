import select from 'lodash';
import Sequelize from 'sequelize';
import helper from '../helpers/helper';
import { sendAccountVerification as mailingHelper } from '../helpers/mailing';
/* eslint-disable class-methods-use-this */
import model from '../models/index';

const { user: UserModel, userverification: UserVerificationModel } = model;

const { Op } = Sequelize;
/**
 * @param { class } User -- User }
 */
class User {
  /**
   * @author: Mwibutsa Floribert
   * @param {Object} req -- request object
   * @param {Object} res  -- response object
   * @returns { Middleware } -- returns nothing
   */
  static async signUpWithEmail(req, res) {
    try {
      const data = req.body;
      const newUser = { ...data };
      // check if the user does not already exist
      const emailUsed = await UserModel.findOne({ where: { email: newUser.email } });
      const userNameUsed = await UserModel.findOne({ where: { username: newUser.username } });
      const uniqueEmailUsername = helper.handleUsed(emailUsed, userNameUsed);
      if (uniqueEmailUsername === true) {
        const result = await UserModel.create(newUser);
        // Email verification
        const verificationHash = mailingHelper(result.email, `${result.firstname} ${result.lastname}`);
        const verification = {
          userid: result.id,
          hash: verificationHash,
          status: 'Pending'
        };
        await UserVerificationModel.create(verification);
        //
        let userAccount = select.pick(result, ['id', 'firstname', 'lastname', 'username', 'email', 'image']);
        const token = helper.generateToken(userAccount);
        userAccount = select.pick(result, ['username', 'email', 'bio', 'image']);
        return helper.authenticationResponse(res, token, userAccount);
      }
      return res.status(400).json({ error: uniqueEmailUsername });
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  /**
   * @param {Object} req
   * @param {Object} res
   * @returns { null } --
   */
  static async loginWithEmail(req, res) {
    const { email, password } = req.body;
    const { email: username } = req.body;
    try {
      const user = await UserModel.findOne({ where: { [Op.or]: [{ email }, { username }] } });
      // verify password
      if (user && helper.comparePassword(password, user.password)) {
        // return user and token
        let userAccount = select.pick(user, ['id', 'firstname', 'lastname', 'username', 'email', 'image']);
        const token = helper.generateToken(userAccount);
        userAccount = select.pick(user, ['username', 'email', 'bio', 'image']);
        return helper.authenticationResponse(res, token, userAccount);
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    } catch (error) {
      const status = (error.name === 'SequelizeValidationError') ? 400 : 500;
      return res.status(status).json({ error: `${error.message}` });
    }
  }

  /**
   * @author frank harerimana
   * @param {*} req user from social
   * @param {*} res logged
   * @returns { object } user logged in
   */
  static async socialLogin(req, res) {
    const ruser = {
      username: req.user.username,
      email: req.user.email,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      bio: req.user.bio,
      image: req.user.image,
      provider: req.user.provider,
      provideruserid: req.user.provideruserid
    };
    const result = await new UserModel().socialUsers(ruser);
    let userAccount = select.pick(result, ['id', 'firstname', 'lastname', 'username', 'email', 'image']);
    const token = helper.generateToken(userAccount);
    userAccount = select.pick(result, ['username', 'email', 'bio', 'image']);
    return helper.authenticationResponse(res, token, userAccount);
  }

  /**
   * @author Jacques Nyilinkindi
   * @param {*} req
   * @param {*} res
   * @returns { object } response
   */
  static async verifyUser(req, res) {
    const { hash } = req.params;
    try {
      const verify = await UserVerificationModel.findOne({ where: { hash, status: 'Pending' } });
      // verification
      if (verify) {
        // verify user
        const { id } = verify;
        await UserModel.update({ verified: true }, { where: { id } });
        await UserVerificationModel.update({ status: 'Used' }, { where: { hash, userid: id } });
        return res.status(401).json({ message: 'Account verified' });
      }
      return res.status(401).json({ error: 'Verification token not found' });
    } catch (error) {
      const status = (error.name === 'SequelizeValidationError') ? 400 : 500;
      return res.status(status).json({ error: `${error.message}` });
    }
  }
}
export default User;
