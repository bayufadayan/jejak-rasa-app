export default class RegisterPresenter {
    #view;
    #model;

    constructor({view, model }) {
        this.#view = view;
        this.#model = model;
    }

    async getRegistered ({name, email, password}) {
        this.#view.showLoading(true);

        try {
            const response =  await this.#model.getRegistered({name, email, password});

            if (!response.ok) {
                console.error("getRegistered: response:", response)
                this.#view.registeredFailed(response.message);
                return;
            }

            this.#view.registeredSuccessfully(response.message, response.loginResult);
        } catch (error) {
            console.error("getRegistered: Error:", error);
                this.#view.registeredFailed(response.message);
        } finally {
            this.#view.showLoading(false);
        }
    }
}