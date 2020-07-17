const { blogPosts } = require('../schemas')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

class Post {
    constructor(){
        this.postModel = blogPosts
    }

    increaseLikeCount = (postId) =>{
        return this.postModel.findByIdAndUpdate(postId,{
            $inc: {
                "likeCount": 1
            }
        })
    }

    decreaseLikeCount = (postId) =>{
        return this.postModel.findByIdAndUpdate(postId,{
            $inc: {
                "likeCount": -1
            }
        })
    }

    update = (postId, data) =>{
        return this.postModel.findByIdAndUpdate(postId, data)
    }

    delete = (id) =>{
        return this.postModel.findByIdAndRemove(id)
    }

    findById = (postId) =>{
        return this.postModel.findById(postId)
    }

    findByUsername = (userId, pageIndex, pageSize) =>{
        
        return this.postModel.find({
            userId: userId
        }).skip(pageIndex).limit(pageSize).sort({ postDate: -1 })
    }

    create = (data) =>{
        const blogPostObject = new this.postModel(data)
        return blogPostObject.save()
    }

    viewPost = (postId, userId) =>{
        return this.postModel.aggregate([
            {
                $match: { "_id":  ObjectId(postId) }
            },
            {
                $project: { postTitle :1, postContent: 1,postDate: 1, postAuthor:1,postImage:1,userId:1 }
            },
            {
                $lookup: {
                    from:'likes',
                    pipeline: [{ $match: { postId: postId } }, {$project: {postId:0, likedAt:0, userId: 0}}],
                    as:'likes'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    pipeline: [ { $match: { postId: postId } },{ $project: { text:1, createdAt:1 } } ],
                    as: 'comments'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    pipeline: [ { $match: {"_id":  ObjectId(userId)} },{ $project: { profileImage:1,username:1 } } ],
                    as: 'user'
                }
            }
        ])
    }

    find = (pageIndex, pageSize) =>{
        return blogPosts.aggregate([
            {
                "$project": {
                    "_id": {
                        "$toString": "$_id"
                    },
                    "postContent": 1, "postTitle": 1, "postDate": 1, "postAuthor": 1, "postImage": 1, "userId": 1,
                }
            },
            {
                "$lookup": {
                    "from": "comments", "localField": "_id", "foreignField": "postId", "as": "comments"
                }
            },
            {
                "$project": {
                    "comments._id": 1,"postContent":1, "postDate": 1, "postAuthor": 1, "postImage": 1, "userId": 1
                }
            }
        
        ]).sort({postDate:-1}).skip(pageIndex).limit(pageSize)
    }
}

module.exports = new Post()