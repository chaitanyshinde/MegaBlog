import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
  const [post, setPost] = useState(null);
  const { slug } = useParams();
  const navigate = useNavigate();

  const userData = useSelector((state) => state.auth.userData);

  const isAuthor = post && userData ? post.userId === userData.$id : false;

  useEffect(() => {
    if (slug) {
      appwriteService.getPost(slug).then((post) => {
        if (post) setPost(post);
        else navigate("/");
      });
    } else navigate("/");
  }, [slug, navigate]);

  const deletePost = () => {
    appwriteService.deletePost(post.$id).then((status) => {
      if (status) {
        appwriteService.deleteFile(post.featuredImage);
        navigate("/");
      }
    });
  };

  return post ? (
    <div className="py-12 bg-gray-700 min-h-screen">
      <Container>
        <div className="w-full flex justify-center mb-8 relative border rounded-xl shadow-md bg-white p-4">
          <img
            src={appwriteService.getFileView(post.featuredImage)}
            alt={post.title}
            className="rounded-xl max-h-[500px] w-full object-cover"
          />

          {isAuthor && (
            <div className="absolute right-6 top-6 flex gap-2">
              <Link to={`/edit-post/${post.$id}`}>
                <Button bgColor="bg-green-500" className="mr-2">
                  Edit
                </Button>
              </Link>
              <Button bgColor="bg-red-500" onClick={deletePost}>
                Delete
              </Button>
            </div>
          )}
        </div>
        <div className="w-full mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">{post.title}</h1>
        </div>
        <div className="prose prose-lg text-white max-w-none">
          {parse(post.content)}
        </div>
      </Container>
    </div>
  ) : null;
}
