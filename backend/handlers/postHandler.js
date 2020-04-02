const Grid = require('gridfs-stream')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId

const { blogPosts, users, postLikes } = require('../models')
const { getFirstNameAndLastName }  = require('./userHandler')

async function capitalizeUsername(username){
    let userData = await getFirstNameAndLastName(username)
    userData.firstName = userData.firstName.charAt(0).toUpperCase() + userData.firstName.slice(1)
    userData.lastName = userData.lastName.charAt(0).toUpperCase() + userData.lastName.slice(1)
    return userData
}

async function editPostWithoutImageUpdate(req){
    await blogPosts.findByIdAndUpdate(req.params.postId,{
        postTitle: req.body.postTitle,
        postContent: req.body.postContent,
        lastModifiedAt: Date.now()
    })
}

async function editPostWithImageUpdate(req){
    await blogPosts.findByIdAndUpdate(req.params.postId,{
        postTitle: req.body.postTitle,
        postContent: req.body.postContent,
        postImage: req.file.filename,
        lastModifiedAt: Date.now()
    })
}

async function showEditPost(id){
    let post = await blogPosts.findById(id).select({postTitle:1, postContent:1, postImage:1})
    return post
}

async function calculateComments(blogs){
    for(i=0;i<blogs.length;i++){
        let len = blogs[i].comments.length
        blogs[i].comments = len
    }
    return blogs
}

async function viewPost(postId,userId){
    let likeStatus = false
    
    let postData = await blogPosts.aggregate([
        {
            $match: { "_id":  ObjectId(postId) }
        },
        {
            $project: { postTitle :1, postContent: 1,postDate: 1, postAuthor:1,postImage:1,userId:1 }
        },
        {
            $lookup: {
                from:'likes',
                pipeline: [{ $match: { postId: postId } }],
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
    likeCount = postData[0]['likes'].length
    commentCount = postData[0]['comments'].length


    let likeData = await postLikes.findOne({postId: postId, userId: userId})
    if(likeData != null) likeStatus = true

    let data = { 
        post: postData[0],
        commentCount: commentCount, 
        likeCount: likeCount,
        likeStatus: likeStatus
    }
    return data
}

const posts = {
    createNewPost: async (req, res) => {
        let userData = await capitalizeUsername(req.user.username)
        const blogPostObject = new blogPosts({
            postTitle: req.body.postTitle,
            postContent: req.body.postContent,
            postImage: typeof req.file === "undefined" || !req.file ? null : req.file.filename,
            postAuthor: userData.firstName+' '+userData.lastName,
            userId: req.user._id
        })
        await blogPostObject.save((err,post)=>{
            if (err) {
                let error = Object.values(err.errors)[0].message
                res.status(400).json('Something wrong happened, Try again!!!')
            }
            else {
                res.status(200).json('New post created')
            }
        })
    },

    getAllPosts: async (req, res) => {
        let pageIndex = parseInt(req.query.pageIndex)
        let pageSize = parseInt(req.query.pageSize)
        pageIndex = pageIndex * pageSize + 1
        let allBlogs = await blogPosts.aggregate([
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
        ]).skip(pageIndex).limit(pageSize).sort({postDate:-1})
        allBlogs = await calculateComments(allBlogs)
        res.status(200).json({ blogs: allBlogs })
    },

    getPostImage: async (req, res) => {
        let image = {
            filename: req.params.id
        }

        let gfs = Grid(mongoose.connection.db, mongoose.mongo)
        gfs.collection('photos')
            gfs.files.findOne(image, (err, file) => {
                if(!err){
                    try{
                        const readstream = gfs.createReadStream(file.filename)
                        readstream.pipe(res)
                    }
                    catch(e){
                        console.log(e)
                    }
                }
            })
    },

    getParticularPost: async (req, res) => {
        let post
        let editStatus = req.query.edit
        let postId = req.params.id
        let userId = req.user._id
        if(editStatus === 'true'){
            post = await showEditPost(postId)
        }
        else{
            post = await viewPost(postId,userId)   
        }
        res.status(200).send(post)
    },

    getAllParticularUserPost: async (req, res) => {
        let authenticated = false
        if(req.user.username === req.params.username){
            authenticated = true
        }
        let userid = await users.findOne({username: req.params.username}).select({_id:1})
        let userPosts = await blogPosts.aggregate([
            {
                $match: {userId: userid._id}
            },
            {
                $project:{ postTitle: 1, postContent: 1, postAuthor: 1, postImage: 1, postDate: 1 }
            },
            {
                $lookup:{
                    from:'users',
                    pipeline:[
                        {
                            $match: {_id: userid._id}
                        },
                        {
                            $project:{ profileImage: 1, username: 1 }
                        }
                    ],
                    as:'userdata'
                }
            }

        ]).sort({ postDate: -1 })
        res.status(200).json({ postData: userPosts, authenticated: authenticated })
    },

    deleteParticularPost : async (req,res) =>{
        let id = req.params.id
        let userPost = await blogPosts.findById(id)
        if(userPost){
            let authorizedUser = Object.toString(req.user._id) === Object.toString(userPost.userId)
            if(authorizedUser){
                await blogPosts.remove(id)
                res.status(200).json({msg:'Post deleted'})
            }
            else res.status(404).json('Something wrong happened, Try again')
        }
        else res.status(404).json('Post not found')
    },

    editPost : async (req,res)=>{
        if(req.params.username === req.user.username){
            if(req.file  === undefined) await editPostWithoutImageUpdate(req)
            else await editPostWithImageUpdate(req)
            res.status(200).json('Post edited')
        }
        else res.status(400).json('Post not edited. Try again')
    }
}

module.exports = posts
