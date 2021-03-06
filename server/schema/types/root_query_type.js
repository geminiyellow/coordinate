const graphql = require('graphql');

const { GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLID } = graphql;
const UserType = require('./user_type');
const GroupType = require('./group_type');
const GroupDetailType = require('./group_detail_type');
const NotificationType = require('./notification_type');
const { getUser } = require('../../services/user-auth');
const { fetchGroups, fetchGroupDetails } = require('../../services/group');
const { fetchFriends } = require('../../services/friends');
const { fetchNotifications } = require('../../services/notifications');

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: () => ({
    user: {
      type: UserType,
      args: {
        targetID: { type: GraphQLID },
      },
      resolve: (parentValue, { targetID }, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          getUser({ token, targetID })
          .then(user => resolve(user))
          .catch(error => reject(error));
        });
      }
    },
    groups: {
      type: new GraphQLList(GroupType),
      resolve: (parentValue, args, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          fetchGroups({ token })
          .then((groups) => {
            const keys = Array.from(Object.keys(groups));
            const returnArray = keys.map((id) => {
              return {
                id,
                name: groups[id].name
              };
            });
            resolve(returnArray);
          })
          .catch(e => reject(e));
        });
      }
    },
    userGroupDetails: {
      type: new GraphQLList(GroupDetailType),
      resolve: (parentValue, args, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          fetchGroups({ token })
          .then((groups) => {
            const keys = Array.from(Object.keys(groups));
            const groupDetailPromise = keys.map((groupID) => {
              return fetchGroupDetails({ token, groupID });
            });
            Promise.all(groupDetailPromise)
            .then(groupDetailArray => resolve(groupDetailArray))
            .catch(e => console.error(e));
          })
          .catch(e => reject(e));
        });
      }
    },
    groupDetails: {
      type: GroupDetailType,
      args: {
        groupID: { type: new GraphQLNonNull(GraphQLID) }
      },
      resolve: (parentValue, { groupID }, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          fetchGroupDetails({ token, groupID })
          .then((details) => {
            resolve(details);
          })
          .catch(e => reject(e));
        });
      }
    },
    friends: {
      type: new GraphQLList(UserType),
      args: {
        userID: { type: GraphQLID }
      },
      resolve: (parentValue, { userID }, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          fetchFriends({ userID, token })
          .then((friends) => {
            resolve(friends);
          })
          .catch(e => reject(e));
        });
      }
    },
    notifications: {
      type: new GraphQLObjectType({
        name: 'NotificationsObjectType',
        fields: () => ({
          unread: { type: new GraphQLList(NotificationType) },
          read: { type: new GraphQLList(NotificationType) }
        })
      }),
      resolve: (parentValue, args, req) => {
        const token = req.headers.authorization;
        return new Promise((resolve, reject) => {
          fetchNotifications({ token })
          .then(notifications => resolve(notifications))
          .catch(e => reject(e));
        });
      }
    }
  })
});

module.exports = RootQueryType;
