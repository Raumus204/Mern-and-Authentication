export interface BookInput {
    bookId: String;
    authors: [String];
    description: String;
    title: String;
    image?: String;
    link?: String;
}

export interface Context {
    user?: {
        _id: String;
        username: String;
        email: String;
    };
}