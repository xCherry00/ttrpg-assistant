import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ImageUpload from "../../components/common/ImageUpload";
vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ token: "t" }),
}));

vi.mock("../../api/uploads", () => ({
  uploadImage: vi.fn(),
}));

import { uploadImage } from "../../api/uploads";

describe("ImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders preview", () => {
    render(<ImageUpload value="https://example.com/a.png" />);
    expect(screen.getByAltText("Preview")).toBeInTheDocument();
  });

  it("calls uploadImage and onChange", async () => {
    uploadImage.mockResolvedValue({ url: "https://example.com/new.png" });
    const onChange = vi.fn();
    render(<ImageUpload value="" onChange={onChange} />);
    const file = new File(["abc"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Obraz"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Wgraj" }));
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("https://example.com/new.png");
    });
  });

  it("shows error when upload fails", async () => {
    uploadImage.mockRejectedValue(new Error("fail"));
    render(<ImageUpload value="" />);
    const file = new File(["abc"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Obraz"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Wgraj" }));
    expect(await screen.findByText("fail")).toBeInTheDocument();
  });
});
