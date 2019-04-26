import chai from 'chai';
import chaiHttp from 'chai-http';
import faker from 'faker';
import db from '../models';
import index from '../index';

const articleModel = db.article;
const userModel = db.user;
const ratingModel = db.rating;

chai.should();
chai.use(chaiHttp);

/**
 * @author: Clet Mwunguzi
 * @description: tests related to article
 */

const user = {
  username: 'mwunguzi',
  email: 'clet@hjih.com',
  password: '@Cletw1234'
};

const mockUser = {
  username: 'George',
  email: 'username@ui.com',
  password: '@Username19#'
};

let userToken, userTokenId;
let articleSlug;
describe('Create a user for rating an article', () => {
  before('Cleaning the database first', async () => {
    await userModel.destroy({ truncate: true, cascade: true });
    await articleModel.destroy({ truncate: true, cascade: true });
    await ratingModel.destroy({ truncate: true, cascade: true });
  });
  it('should create a user', (done) => {
    chai
      .request(index)
      .post('/api/auth/signup')
      .send(user)
      .then((res) => {
        userToken = res.body.user.token;
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.user.should.be.a('object');
        res.body.user.should.have.property('username').equal('mwunguzi');
        res.body.user.should.have.property('email').equal('clet@hjih.com');
        res.body.user.should.have.property('bio');
        res.body.user.should.have.property('image');
        res.body.user.should.have.property('token');
        done();
      })
      .catch(err => err);
  });

  it('should create a another user', (done) => {
    chai
      .request(index)
      .post('/api/auth/signup')
      .send(mockUser)
      .then((res) => {
        userTokenId = res.body.user.token;
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.user.should.be.a('object');
        res.body.user.should.have.property('username').equal('George');
        res.body.user.should.have.property('email').equal('username@ui.com');
        res.body.user.should.have.property('bio');
        res.body.user.should.have.property('image');
        res.body.user.should.have.property('token');
        (async () => {
          await userModel.destroy({
            where: { email: mockUser.email }
          });
        })();
        done();
      })
      .catch(err => err);
  });
});

const fakeData = {
  title: faker.random.words(),
  description: faker.lorem.paragraphs(),
  body: faker.lorem.paragraphs()
};
describe('Create an article', () => {
  it('should create an article 2', (done) => {
    chai
      .request(index)
      .post('/api/articles')
      .set('Authorization', userToken)
      .send(fakeData)
      .then((res) => {
        articleSlug = res.body.article.slug;
        res.should.have.status(201);
        res.body.should.have.property('article');
        res.body.should.be.a('object');
        res.body.article.should.be.a('object');
        res.body.article.should.have.property('id');
        res.body.article.should.have.property('slug').equal(articleSlug);
        res.body.article.should.have.property('title').equal(fakeData.title);
        res.body.article.should.have.property('description');
        res.body.article.should.have.property('body').equal(fakeData.body);
        res.body.article.should.have.property('authorid');
        res.body.article.should.have.property('taglist');
        res.body.article.should.have.property('createdAt');
        res.body.article.should.have.property('updatedAt');
        done();
      })
      .catch(err => err);
  });
});

describe('Rate an article', () => {
  it('should not enter an invalid slug', (done) => {
    chai
      .request(index)
      .post('/api/articles/23/rate/Terrible')
      .set('Authorization', userToken)
      .then((res) => {
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.should.have.property('status').equal(400);
        res.body.should.have.property('error').equal('slug of an article can not be a number.');
        done();
      })
      .catch(err => err);
  });

  it('Should not enter an invalid article rating', (done) => {
    chai
      .request(index)
      .post(`/api/articles/${articleSlug}/rate/Terribl`)
      .set('Authorization', userToken)
      .then((res) => {
        res.should.have.status(400);
        res.body.should.be.a('object');
        res.body.should.have.property('status').equal(400);
        res.body.should.have.property('error').equal('invalid rating');
        done();
      })
      .catch(err => err);
  });

  it("Should not create article if user don't exists", (done) => {
    chai
      .request(index)
      .post(`/api/articles/${articleSlug}/rate/Good`)
      .set('Authorization', userTokenId)
      .then((res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('status').equal(404);
        res.body.should.have.property('error').equal('User not found');
        done();
      })
      .catch(err => err);
  });

  it('Should verify if article exists', (done) => {
    chai
      .request(index)
      .post('/api/articles/slug12!/rate/Terrible')
      .set('Authorization', userToken)
      .then((res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('status').equal(404);
        res.body.should.have.property('error').equal('Article can not be found.');
        done();
      })
      .catch(err => err);
  });

  it('Should create a new rate for an article', (done) => {
    chai
      .request(index)
      .post(`/api/articles/${articleSlug}/rate/Terrible`)
      .set('Authorization', userToken)
      .then((res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('rated_article');
        res.body.rated_article.should.be.a('object');
        res.body.rated_article.should.have.property('status').equal(201);
        res.body.rated_article.should.have.property('id');
        res.body.rated_article.should.have.property('user');
        res.body.rated_article.user.should.have.property('id');
        res.body.rated_article.user.should.have.property('username').equal('mwunguzi');
        res.body.rated_article.should.have.property('article');
        res.body.rated_article.article.should.have.property('title').equal(fakeData.title);
        res.body.rated_article.article.should.have.property('slug').equal(articleSlug);
        res.body.rated_article.should.have.property('rating').equal('Terrible');
        done();
      })
      .catch(err => err);
  });

  it('Should update a rating for an article', (done) => {
    chai
      .request(index)
      .post(`/api/articles/${articleSlug}/rate/Good`)
      .set('Authorization', userToken)
      .then((res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('rated_article');
        res.body.rated_article.should.be.a('object');
        res.body.rated_article.should.have.property('status').equal(200);
        res.body.rated_article.should.have.property('id');
        res.body.rated_article.should.have.property('user');
        res.body.rated_article.user.should.have.property('id');
        res.body.rated_article.user.should.have.property('username').equal('mwunguzi');
        res.body.rated_article.should.have.property('article');
        res.body.rated_article.article.should.have.property('title').equal(fakeData.title);
        res.body.rated_article.article.should.have.property('slug').equal(articleSlug);
        res.body.rated_article.should.have.property('rating').equal('Good');
        res.body.rated_article.should.have.property('previousRating').equal('Terrible');
        done();
      })
      .catch(err => err);
  });

  it('Should not rate an article more than once with the same rating', (done) => {
    chai
      .request(index)
      .post(`/api/articles/${articleSlug}/rate/Good`)
      .set('Authorization', userToken)
      .then((res) => {
        res.body.should.be.a('object');
        res.body.should.have.property('status').equal(403);
        res.body.should.have.property('error').equal('Article can only be rated once.');
        done();
      })
      .catch(err => err);
  });
});
