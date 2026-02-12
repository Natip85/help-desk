import type { Editor } from "@tiptap/react";
import { useState } from "react";
import {
  Bold,
  Check,
  Folder,
  Highlighter,
  ImageIcon,
  Italic,
  Link,
  Loader2,
  MoreVertical,
  Quote,
  Redo,
  Strikethrough,
  TypeIcon,
  Underline,
  Undo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

export type EditorState = {
  isBold?: boolean;
  canBold?: boolean;
  isItalic?: boolean;
  canItalic?: boolean;
  isStrike?: boolean;
  canStrike?: boolean;
  isCode?: boolean;
  canCode?: boolean;
  isUnderline?: boolean;
  canUnderline?: boolean;
  isHighlight?: boolean;
  canHighlight?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  currentColor?: string;
  isParagraph?: boolean;
  isHeading1?: boolean;
  isHeading2?: boolean;
  isHeading3?: boolean;
  isBulletList?: boolean;
  isOrderedList?: boolean;
  isCodeBlock?: boolean;
  isBlockquote?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
};

type EditorToolbarProps = {
  editor: Editor | null;
  editorState: EditorState;
};

type BlockOption = {
  label: string;
  icon?: React.ReactNode;
  isActive: () => boolean;
  action: () => void;
};

const TEXT_COLORS = [
  { name: "Default", color: undefined },
  { name: "Gray", color: "#6b7280" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f97316" },
  { name: "Yellow", color: "#eab308" },
  { name: "Green", color: "#22c55e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Purple", color: "#a855f7" },
  { name: "Pink", color: "#ec4899" },
];

export function EditorToolbar({ editor, editorState }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // const { setSearchParams } = useNotesSearchParams();

  // const { data: folders } = useQuery(trpc.folder.list.queryOptions());

  // const { mutate: moveNote } = useMutation(
  //   trpc.note.move.mutationOptions({
  //     onSuccess: (data, variables) => {
  //       if (currentFolderId) {
  //         void queryClient.invalidateQueries({
  //           queryKey: trpc.note.list.queryKey({ folderId: currentFolderId }),
  //         });
  //       }
  //       void queryClient.invalidateQueries({
  //         queryKey: trpc.note.list.queryKey({ folderId: variables.folderId }),
  //       });
  //       void setSearchParams({ folderId: variables.folderId, noteId: variables.id });
  //     },
  //   })
  // );

  // const { mutate: togglePin } = useMutation(
  //   trpc.note.togglePin.mutationOptions({
  //     onSuccess: (data) => {
  //       if (currentFolderId) {
  //         void queryClient.invalidateQueries({
  //           queryKey: trpc.note.list.queryKey({ folderId: currentFolderId }),
  //         });
  //       }
  //       if (data) {
  //         queryClient.setQueryData(trpc.note.get.queryKey({ id: data.id }), data);
  //       }
  //     },
  //   })
  // );

  const handleSetColor = (color: string | undefined) => {
    if (color) {
      editor?.chain().focus().setColor(color).run();
    } else {
      editor?.chain().focus().unsetColor().run();
    }
    setShowColorPicker(false);
  };

  const handleSetLink = () => {
    if (linkUrl) {
      editor?.chain().focus().setLink({ href: linkUrl }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleLinkToggle = () => {
    if (editorState?.isLink) {
      editor?.chain().focus().unsetLink().run();
    } else {
      setLinkUrl(editorState?.linkUrl ?? "");
      setShowLinkInput(true);
    }
  };

  const blockOptions: BlockOption[] = [
    {
      label: "Title",
      isActive: () => editorState?.isHeading1 ?? false,
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading",
      isActive: () => editorState?.isHeading2 ?? false,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Subheading",
      isActive: () => editorState?.isHeading3 ?? false,
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Body",
      isActive: () => editorState?.isParagraph ?? false,
      action: () => editor?.chain().focus().setParagraph().run(),
    },
    {
      label: "Monostyled",
      isActive: () => editorState?.isCodeBlock ?? false,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Bulleted List",
      icon: <span className="text-muted-foreground mr-1">•</span>,
      isActive: () => editorState?.isBulletList ?? false,
      action: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered List",
      icon: <span className="text-muted-foreground mr-1 text-xs">1.</span>,
      isActive: () => editorState?.isOrderedList ?? false,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Block Quote",
      icon: <Quote className="text-muted-foreground mr-1 h-3 w-3 rotate-180" />,
      isActive: () => editorState?.isBlockquote ?? false,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="bg-muted/50 flex h-11 min-w-0 items-center gap-1.5 overflow-x-auto border-b px-3">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.commands.undo()}
          disabled={!editorState?.canUndo}
          className="text-muted-foreground hover:text-foreground hover:bg-accent size-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.commands.redo()}
          disabled={!editorState?.canRedo}
          className="text-muted-foreground hover:text-foreground hover:bg-accent size-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <div className="bg-border mx-1.5 h-6 w-px" />

      {/* Formatting Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent size-8 p-0"
          >
            <TypeIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-0"
          align="start"
          sideOffset={8}
          onFocusOutside={(e) => e.preventDefault()}
        >
          {/* Mini Toolbar */}
          <div className="flex items-center gap-0.5 overflow-x-auto border-b p-2">
            <Toggle
              size="sm"
              pressed={editorState?.isBold}
              onPressedChange={() => editor?.chain().focus().toggleBold().run()}
              disabled={!editorState?.canBold}
              className="size-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editorState?.isItalic}
              onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
              disabled={!editorState?.canItalic}
              className="size-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editorState?.isUnderline}
              onPressedChange={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={!editorState?.canUnderline}
              className="size-8 p-0"
            >
              <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={editorState?.isStrike}
              onPressedChange={() => editor?.chain().focus().toggleStrike().run()}
              disabled={!editorState?.canStrike}
              className="size-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Toggle>

            <div className="bg-border mx-1 h-5 w-px" />

            <Toggle
              size="sm"
              pressed={editorState?.isHighlight}
              onPressedChange={() => editor?.chain().focus().toggleHighlight().run()}
              disabled={!editorState?.canHighlight}
              className="size-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Toggle>

            {/* Color Picker Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <span
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: editorState?.currentColor ?? "currentColor" }}
              />
            </Button>

            <div className="bg-border mx-1 h-5 w-px" />

            <Toggle
              size="sm"
              pressed={editorState?.isLink}
              onPressedChange={handleLinkToggle}
              className="size-8 p-0"
            >
              <Link className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={showImageUpload}
              onPressedChange={() => setShowImageUpload(!showImageUpload)}
              className="size-8 p-0"
            >
              {isUploading ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : <ImageIcon className="h-4 w-4" />}
            </Toggle>
          </div>

          {/* Link Input */}
          {showLinkInput && (
            <div className="flex items-center gap-2 border-b p-2">
              <Input
                type="url"
                placeholder="Enter URL..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSetLink();
                  }
                  if (e.key === "Escape") {
                    setShowLinkInput(false);
                    setLinkUrl("");
                  }
                }}
                className="h-8 flex-1 text-sm"
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleSetLink}
                className="h-8"
              >
                {linkUrl ? "Set" : "Remove"}
              </Button>
            </div>
          )}

          {/* Image Upload */}
          {showImageUpload && (
            <div className="border-b p-2">
              <UploadButton
                endpoint="imageUploader"
                onUploadBegin={() => setIsUploading(true)}
                onClientUploadComplete={(res) => {
                  setIsUploading(false);
                  if (res?.[0]?.url) {
                    editor?.chain().focus().setImage({ src: res[0].url }).run();
                  }
                  setShowImageUpload(false);
                }}
                onUploadError={() => {
                  setIsUploading(false);
                }}
                appearance={{
                  button:
                    "ut-ready:bg-primary ut-uploading:bg-primary/50 text-primary-foreground text-sm h-8 px-3",
                  allowedContent: "text-muted-foreground text-xs",
                }}
              />
            </div>
          )}

          {/* Color Picker */}
          {showColorPicker && (
            <div className="flex flex-wrap gap-1 border-b p-2">
              {TEXT_COLORS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  title={item.name}
                  onClick={() => handleSetColor(item.color)}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    editorState?.currentColor === item.color && "ring-primary ring-2 ring-offset-1"
                  )}
                  style={{
                    backgroundColor: item.color ?? "transparent",
                    borderColor: item.color ? "transparent" : "currentColor",
                  }}
                />
              ))}
            </div>
          )}

          {/* Block Options List */}
          <div className="py-1">
            {blockOptions.map((option) => (
              <Button
                variant="ghost"
                type="button"
                key={option.label}
                onClick={() => {
                  option.action();
                }}
                className={cn(
                  "hover:bg-accent flex w-full items-center justify-start px-3 py-2 text-sm transition-colors",
                  option.isActive() && "bg-accent/50"
                )}
              >
                {option.isActive() && <Check className="mr-2 h-4 w-4" />}
                {!option.isActive() && option.icon && (
                  <span className="mr-2 flex h-4 w-4 items-center justify-center">
                    {option.icon}
                  </span>
                )}
                {!option.isActive() && !option.icon && <span className="mr-2 h-4 w-4" />}
                <span
                  className={cn(
                    option.label === "Title" && "text-xl font-bold",
                    option.label === "Heading" && "text-lg font-semibold",
                    option.label === "Subheading" && "text-base font-medium",
                    option.label === "Body" && "text-sm",
                    option.label === "Monostyled" && "font-mono text-sm"
                  )}
                >
                  {option.label}
                </span>
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent size-8 p-0"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
        >
          <DropdownMenuItem
            onClick={() => {
              // if (noteId) {
              //   togglePin({ id: noteId });
              // }
            }}
          >
            item here
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Folder />
              Move to
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>stuff here</DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
