'use strict';
import { Model } from 'sequelize';

import { roomRoles } from '../utils/common/roles.js'
const { JOINED, ADMIN } = roomRoles
export default (sequelize, DataTypes) => {
  class Room_details extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: "CASCADE"
      })
      this.belongsTo(models.Room, {
        foreignKey: 'room_id',
        onDelete: 'CASCADE'
      })
    }
  }
  Room_details.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      room_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Room',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      role: {
        type: DataTypes.ENUM(JOINED, ADMIN),
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Room_details'
    }
  );
  return Room_details;
};