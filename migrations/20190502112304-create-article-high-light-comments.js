

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('articlehighlightcomment', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userid: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    articleid: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    comment: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    text: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    positionleft: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    positiontop: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
      default: true
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }

  }),

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => Promise.all([queryInterface.dropTable('articlehighlightcomment')])
};
