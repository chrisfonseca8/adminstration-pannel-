'use strict';

import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            // define association here
            // this.hasMany(models.Room, {
            //     foreignKey: 'admin',
            //     onUpdate: 'CASCADE'
            // })

            // this.hasMany(models.Room_details, {
            //     foreignKey: 'user_id',
            //     onDelete: 'CASCADE'
            // })
        }
    }

    User.init({
        sub: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            validate: {
                isEmail: true,
            },
            allowNull: false,
            unique: true,
        },
        admin_rooms: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        joined_rooms: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users',
    });

    return User;
};