'use strict';
import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: 'admin',
        onDelete: 'CASCADE'
      })

      this.hasMany(models.Room_details, {
        foreignKey: 'room_id',
        onDelete: 'CASCADE'
      })
    }
  }
  Room.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      admin: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // should match your table name
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    },
    {
      sequelize,
      modelName: 'Room'
    }
  );

  return Room;
};