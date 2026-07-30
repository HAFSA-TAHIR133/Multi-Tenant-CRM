import React from "react";
import { cn } from "@/lib/tiptap-utils";
import {
  DropdownMenu as BaseDropdownMenu,
  DropdownMenuTrigger as BaseDropdownMenuTrigger,
  DropdownMenuContent as BaseDropdownMenuContent,
  DropdownMenuItem as BaseDropdownMenuItem,
  DropdownMenuGroup as BaseDropdownMenuGroup,
  DropdownMenuSub as BaseDropdownMenuSub,
  DropdownMenuPortal as BaseDropdownMenuPortal,
  DropdownMenuSubContent as BaseDropdownMenuSubContent,
  DropdownMenuSubTrigger as BaseDropdownMenuSubTrigger,
  DropdownMenuRadioGroup as BaseDropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";

import "@/components/editor/tiptap-ui-primitive/dropdown-menu/dropdown-menu.scss";

function DropdownMenu({ children, modal = false, ...props }) {
  return (
    <BaseDropdownMenu modal={modal} {...props}>
      {children}
    </BaseDropdownMenu>
  );
}

function DropdownMenuPortal(props) {
  return <BaseDropdownMenuPortal {...props} />;
}

const DropdownMenuTrigger = React.forwardRef(({ children, ...props }, ref) => (
  <BaseDropdownMenuTrigger ref={ref} {...props}>
    {children}
  </BaseDropdownMenuTrigger>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuGroup = BaseDropdownMenuGroup;
const DropdownMenuSub = BaseDropdownMenuSub;
const DropdownMenuRadioGroup = BaseDropdownMenuRadioGroup;
const DropdownMenuItem = BaseDropdownMenuItem;
const DropdownMenuSubTrigger = BaseDropdownMenuSubTrigger;

const DropdownMenuSubContent = React.forwardRef(
  ({ className, portal = true, children, ...props }, ref) => {
    const content = (
      <BaseDropdownMenuSubContent
        ref={ref}
        className={cn("tiptap-dropdown-menu", className)}
        {...props}
      >
        {children}
      </BaseDropdownMenuSubContent>
    );

    return portal ? (
      <DropdownMenuPortal {...(typeof portal === "object" ? portal : {})}>
        {content}
      </DropdownMenuPortal>
    ) : (
      content
    );
  }
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuContent = React.forwardRef(
  ({ className, sideOffset = 4, portal = false, children, ...props }, ref) => {
    const content = (
      <BaseDropdownMenuContent
        ref={ref}
        sideOffset={sideOffset}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn("tiptap-dropdown-menu", className)}
        {...props}
      >
        {children}
      </BaseDropdownMenuContent>
    );

    return portal ? (
      <DropdownMenuPortal {...(typeof portal === "object" ? portal : {})}>
        {content}
      </DropdownMenuPortal>
    ) : (
      content
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};