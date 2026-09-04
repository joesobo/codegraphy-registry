import { generate, ident, parse, walk } from "css-tree";

function embeddedResource(value: string): boolean {
  return /^data:(?:image\/[a-z0-9.+-]+|font\/[a-z0-9.+-]+|application\/(?:font-woff|vnd\.ms-fontobject));base64,[a-z0-9+/=\s]+$/i.test(
    value,
  );
}

export function validateThemeCss(css: string): string {
  const tree = parse(css, {
    parseCustomProperty: true,
    onParseError(error) {
      throw new Error(`Invalid theme CSS: ${error.message}`);
    },
  });
  walk(tree, (node) => {
    if (node.type === "Raw") throw new Error("Theme CSS contains syntax that cannot be validated");
    if (node.type === "Atrule" && ident.decode(node.name).toLowerCase() === "import")
      throw new Error("Theme CSS cannot import stylesheets. Include styles in the package.");
    if (node.type === "Url" && !embeddedResource(node.value))
      throw new Error("Theme CSS resources must be embedded image or font data URLs");
    if (
      node.type === "Function" &&
      ["image-set", "-webkit-image-set", "image", "src"].includes(
        ident.decode(node.name).toLowerCase(),
      )
    ) {
      walk(node, function (child) {
        if (child.type === "Function" && ident.decode(child.name).toLowerCase() === "type")
          return this.skip;
        if (child.type === "String" && !embeddedResource(child.value))
          throw new Error("Theme CSS image sources must be embedded data URLs");
        if (
          child.type === "Function" &&
          ["var", "attr"].includes(ident.decode(child.name).toLowerCase())
        )
          throw new Error("Theme CSS image sources must declare embedded resources directly");
      });
    }
  });
  return generate(tree);
}
