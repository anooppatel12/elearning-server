import tryCatch from "../middlewares/tryCatch.js";
import { Courses } from "../models/courses.js";
import { Lecture } from "../models/lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import {User} from "../models/user.js";

export const createCourse = tryCatch(async(req, res)=>{
    const { title, description, category, createdBy, duration, price } = req.body;

    const image = req.file;

    await Courses.create({
        title,
        description,
        category,
        createdBy,
        image: image?.path,
        duration,
        price,
    });

    res.status(201).json({
        message: "Course Created Successfully",
    });
});


export const addLectures = tryCatch(async(req,res)=>{
    const course = await Courses.findById(req.params.id)

    if(!course)
    return res.status(400).json({
        message: "No Course with this id",
    });

    const {title, description} = req.body

    const file = req.file

    const lecture = await Lecture.create({
        title,
        description,
        video: file?.path,
        course: course._id,
    });

    res.status(201).json({
        message: "Lecture Added Successfully",
        lecture,
    });
});


export const deleteLecture = tryCatch(async(req,res)=>{
    const lecture = await Lecture.findById(req.params.id)

    rm(lecture.video,()=>{
        console.log("Video deleted");
    });

    await lecture.deleteOne()

    res.json({message: "Lecture Deleted"});
});


const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = tryCatch(async(req,res)=>{
    const course = await Courses.findById(req.params.id)

    const lectures = await Lecture.find({course: course._id})

    await Promise.all(
        lectures.map(async(lecture)=>{
            await unlinkAsync(lecture.video);
            console.log('video deleted');
        })
    );

    rm(course.image,()=>{
        console.log("Image deleted");
    });

    await Lecture.find({course: req.params.id }).deleteMany();

    await course.deleteOne();

    await User.updateMany({}, { $pull: { subscription: req.params.id }});

    res.json({
        message: "Course Deleted Successfully",
    });
});


export const getAllStats = tryCatch(async(req,res)=>{
    const totalCourses = (await Courses.find()).length;
    const totalLectures = (await Lecture.find()).length;
    const totalUsers = (await User.find()).length;


    const stats = {
        totalCourses,
        totalLectures,
        totalUsers,
    };

    res.json({
        stats,
    });
});


export const getAllUser = tryCatch(async(req,res)=>{
    const users = await User.find({_id: { $ne: req.user._id}}).select("-password");

    res.json({users});
});

export const updateRole = tryCatch(async(req,res)=> {
    const user = await User.findById(req.params.id)

    if(user.role === "user"){
        user.role = "admin";
        await user.save()

        return res.status(200).json({
            message: "Role updated to admin",
        });
    }

    if(user.role === "admin"){
        user.role = "user";
        await user.save()

        return res.status(200).json({
            message: "Role updated",
        });
    }
})