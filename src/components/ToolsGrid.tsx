import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Scissors, FileImage, Monitor } from "lucide-react";
import { motion } from "framer-motion";

export default function ToolsGrid() {
  const tools = [
    {
      title: "HEIC to JPG Converter",
      desc: "Convert HEIC images to JPG instantly with high quality.",
      icon: Image,
      link: "/heic-to-jpg",
    },
    {
      title: "Resize Passport Photo",
      desc: "Resize and format passport photos for official use.",
      icon: Scissors,
      link: "/resize-passport-photo",
    },
    {
      title: "Compress for WhatsApp",
      desc: "Compress images without losing quality for fast sharing.",
      icon: FileImage,
      link: "/compress-image-for-whatsapp",
    },
    {
      title: "Discord PFP Resizer",
      desc: "Resize profile pictures perfectly for Discord avatars.",
      icon: Monitor,
      link: "/discord-pfp-resizer",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-white to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">
          Image Tools Suite
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl shadow-md hover:shadow-xl transition">
                <CardContent className="p-6 text-center space-y-3">
                  <tool.icon className="w-10 h-10 mx-auto text-blue-500" />
                  <h2 className="text-lg font-semibold">{tool.title}</h2>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                  <Button
                    className="mt-2 w-full"
                    onClick={() => (window.location.href = tool.link)}
                  >
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
