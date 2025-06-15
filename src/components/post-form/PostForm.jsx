import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
  const { register, handleSubmit, watch, setValue, control, getValues } =
    useForm({
      defaultValues: {
        title: post?.title || "",
        slug: post?.$id || "",
        content: post?.content || "",
        status: post?.status || "active",
      },
    });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);

  const submit = async (data) => {
    console.log("=== POST FORM SUBMISSION START ===");
    console.log("Form data received:", data);
    console.log("User data:", userData);
    console.log("Image data:", data.image);
    console.log("Image file exists:", !!data.image?.[0]);

    try {
      let fileId = null;

      // Handle file upload if image is provided
      if (data.image && data.image[0] && data.image[0] instanceof File) {
        console.log("✅ Valid image file detected:", data.image[0]);
        console.log("File details:", {
          name: data.image[0].name,
          size: data.image[0].size,
          type: data.image[0].type,
          lastModified: data.image[0].lastModified,
        });

        // Validate file size (max 10MB)
        if (data.image[0].size > 10 * 1024 * 1024) {
          throw new Error("Image file is too large. Maximum size is 10MB.");
        }

        // Validate file type
        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
        ];
        if (!allowedTypes.includes(data.image[0].type)) {
          throw new Error(
            "Invalid file type. Please upload a JPG, PNG, or GIF image."
          );
        }

        console.log("⏳ Starting file upload...");
        const file = await appwriteService.uploadFile(data.image[0]);
        console.log("📁 File upload result:", file);

        if (file && file.$id) {
          fileId = file.$id;
          console.log("✅ File uploaded successfully with ID:", fileId);

          // Delete old image if updating existing post
          if (post && post.featuredImage) {
            console.log("🗑️ Deleting old image:", post.featuredImage);
            try {
              await appwriteService.deleteFile(post.featuredImage);
              console.log("✅ Old image deleted successfully");
            } catch (deleteError) {
              console.warn("⚠️ Failed to delete old image:", deleteError);
              // Don't fail the entire operation if we can't delete the old image
            }
          }
        } else {
          console.error(
            "❌ File upload failed - no file object or ID returned"
          );
          console.error("File object:", file);
          throw new Error("Failed to upload image - no file ID received");
        }
      } else if (post?.featuredImage) {
        // Keep existing image if no new image uploaded
        fileId = post.featuredImage;
        console.log("📷 No new image uploaded, keeping existing:", fileId);
      } else if (!post) {
        // New post requires an image
        console.error("❌ No image provided for new post");
        throw new Error("Please select an image for your post");
      }

      // Prepare post data
      const postData = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        status: data.status,
        userId: userData.$id,
      };

      // Only add featuredImage if we have a valid fileId
      if (fileId) {
        postData.featuredImage = fileId;
        console.log("📷 Adding featured image to post data:", fileId);
      }

      console.log("📝 Prepared post data:", postData);

      let dbPost;
      if (post) {
        // Update existing post
        console.log("✏️ Updating existing post with ID:", post.$id);
        dbPost = await appwriteService.updatePost(post.$id, postData);
        console.log("✅ Post updated successfully:", dbPost);
      } else {
        // Create new post
        console.log("➕ Creating new post");
        dbPost = await appwriteService.createPost(postData);
        console.log("✅ Post created successfully:", dbPost);
      }

      if (dbPost && dbPost.$id) {
        console.log("=== 🎉 POST OPERATION SUCCESSFUL ===");
        console.log("Final post data:", dbPost);
        console.log("Featured image in saved post:", dbPost.featuredImage);
        navigate(`/post/${dbPost.$id}`);
      } else {
        console.error(
          "❌ Post operation failed - no post returned or missing ID"
        );
        console.error("Returned post object:", dbPost);
        throw new Error("Failed to save post - invalid response from server");
      }
    } catch (error) {
      console.error("=== ❌ POST FORM SUBMISSION ERROR ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      // Show user-friendly error message
      alert(`Failed to ${post ? "update" : "create"} post: ${error.message}`);
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string")
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]+/g, "-")
        .replace(/\s/g, "-");

    return "";
  }, []);

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), { shouldValidate: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input
          label="Title :"
          placeholder="Title"
          className="mb-4"
          {...register("title", { required: true })}
        />
        <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4"
          {...register("slug", { required: true })}
          onInput={(e) => {
            setValue("slug", slugTransform(e.currentTarget.value), {
              shouldValidate: true,
            });
          }}
        />
        <RTE
          label="Content :"
          name="content"
          control={control}
          defaultValue={getValues("content")}
        />
      </div>
      <div className="w-1/3 px-2">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4"
          accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register("image", { required: !post })}
        />
        {post && post.featuredImage && (
          <div className="w-full mb-4">
            <img
              src={appwriteService.getFilePreview(post.featuredImage)}
              alt={post.title}
              className="rounded-lg max-w-full"
              onLoad={() => console.log("Preview image loaded successfully")}
              onError={(e) => {
                console.error("Preview image failed to load");
                console.error("Preview image src:", e.target.src);
              }}
            />
          </div>
        )}
        <Select
          options={["active", "inactive"]}
          label="Status"
          className="mb-4"
          {...register("status", { required: true })}
        />
        <Button type="submit" className="w-full">
          {post ? "Update" : "Submit"}
        </Button>

        {/* Temporary test button - remove after debugging */}
        <Button
          type="button"
          className="w-full mt-2 bg-blue-500"
          onClick={async () => {
            const fileInput = document.querySelector('input[type="file"]');
            const file = fileInput?.files[0];

            if (!file) {
              alert("Please select a file first");
              return;
            }

            console.log("🧪 TESTING FILE UPLOAD");
            console.log("Selected file:", file);

            try {
              const result = await appwriteService.uploadFile(file);
              console.log("✅ Upload test successful:", result);
              alert(`Upload successful! File ID: ${result.$id}`);
            } catch (err) {
              console.error("❌ Upload test failed:", err);
              alert(`Upload failed: ${err.message}`);
            }
          }}
        >
          Test Upload Only
        </Button>
      </div>
    </form>
  );
}
