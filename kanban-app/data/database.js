const { Sequelize, Model, DataTypes } = require('sequelize'),
    sequelize = new Sequelize('sqlite::memory:', {
        logging: false
    }),
    defaultData = require('../defaultdata.json');

class User extends Model {}
class Project extends Model {}
class Task extends Model {}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    name: DataTypes.STRING,
    avatarUrl: DataTypes.STRING

}, { sequelize, modelName: 'user' });

Project.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    name: DataTypes.STRING

}, { sequelize, modelName: 'project' });

Task.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    desc: DataTypes.STRING,
    status: DataTypes.NUMBER

}, { sequelize, modelName: 'task' });

User.hasMany(Project, { onDelete: 'cascade' });
Project.belongsTo(User);

Project.hasMany(Task, { onDelete: 'cascade' });
Task.belongsTo(Project);

sequelize.sync().then(async() => {
    const taskQueue = defaultData.map(async(json_data) => {
        const user = await User.create({ id: json_data.id, name: json_data.name, avatarUrl: json_data.image });
        const projects = await Promise.all(json_data.projects.map(async(_project) => {
            const tasks = await Promise.all(_project.tasks.map(({ id, desc, status }) => Task.create({ id, desc, status })))
            const project = await Project.create({ id: _project.id, name: _project.name });
            return project.setTasks(tasks);
        }))
        return await user.setProjects(projects);
    })
    await Promise.all(taskQueue).then(data => {
        console.log('Default data loaded', JSON.stringify(data, null, 2));
    }).catch(console.error);
})

module.exports = {
    User,
    Project,
    Task,
    sequelize
}