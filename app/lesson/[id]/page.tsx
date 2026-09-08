import {getLesson} from "@/data/courses";import {notFound} from "next/navigation";import {LessonPlayer} from "@/components/lesson-player";
export default async function LessonPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const lesson=getLesson(id);if(!lesson)notFound();return <LessonPlayer lesson={lesson} course={lesson.course}/>}
